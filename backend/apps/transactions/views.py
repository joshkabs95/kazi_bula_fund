from decimal import Decimal
from datetime import date
from django.db.models import Sum, Q, Avg
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Transaction
from .serializers import TransactionSerializer
from apps.categories.models import Category


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user).select_related('category')
        params = self.request.query_params

        category = params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        type_ = params.get('type')
        if type_ == 'income':
            qs = qs.filter(amount__gt=0)
        elif type_ == 'expense':
            qs = qs.filter(amount__lt=0)

        search = params.get('search')
        if search:
            qs = qs.filter(label__icontains=search)

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, source='manual')

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = Transaction.objects.filter(user=request.user)

        # Filter by year/month if provided
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        if year:
            qs = qs.filter(date__year=year)
        if month:
            qs = qs.filter(date__month=month)

        income_qs = qs.filter(amount__gt=0)
        expense_qs = qs.filter(amount__lt=0)

        total_income = income_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        total_expense = expense_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        balance = total_income + total_expense

        # By category
        by_category = []
        categories = Category.objects.filter(
            Q(user=request.user) | Q(is_default=True)
        )
        for cat in categories:
            cat_qs = qs.filter(category=cat)
            total = cat_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
            count = cat_qs.count()
            if count > 0:
                by_category.append({
                    'id': cat.id,
                    'name': cat.name,
                    'icon': cat.icon,
                    'color': cat.color,
                    'type': cat.type,
                    'total': float(total),
                    'count': count,
                })

        # By month
        by_month_data = (
            Transaction.objects.filter(user=request.user)
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(income=Sum('amount', filter=Q(amount__gt=0)),
                      expense=Sum('amount', filter=Q(amount__lt=0)))
            .order_by('month')
        )
        by_month = [
            {
                'month': item['month'].strftime('%Y-%m'),
                'income': float(item['income'] or 0),
                'expense': float(item['expense'] or 0),
            }
            for item in by_month_data
        ]

        return Response({
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'balance': float(balance),
            'by_category': by_category,
            'by_month': by_month,
        })

    @action(detail=False, methods=['get'])
    def insights(self, request):
        """
        Generate automatic behavioral insights based on user's transactions.
        Compares current month to previous month, checks budget limits, etc.
        """
        today = date.today()
        cur_year, cur_month = today.year, today.month
        if cur_month == 1:
            prev_year, prev_month = cur_year - 1, 12
        else:
            prev_year, prev_month = cur_year, cur_month - 1

        cur_qs = Transaction.objects.filter(
            user=request.user,
            date__year=cur_year,
            date__month=cur_month,
        )
        prev_qs = Transaction.objects.filter(
            user=request.user,
            date__year=prev_year,
            date__month=prev_month,
        )

        insights = []

        # 1. Per-category comparison
        categories = Category.objects.filter(
            Q(user=request.user) | Q(is_default=True),
            type='expense',
        )
        for cat in categories:
            cur_total = abs(float(
                cur_qs.filter(category=cat, amount__lt=0)
                .aggregate(t=Sum('amount'))['t'] or 0
            ))
            prev_total = abs(float(
                prev_qs.filter(category=cat, amount__lt=0)
                .aggregate(t=Sum('amount'))['t'] or 0
            ))

            if cur_total == 0:
                continue

            # Budget limit alert
            if cat.budget_limit:
                limit = float(cat.budget_limit)
                pct = cur_total / limit * 100
                if pct >= 100:
                    insights.append({
                        'type': 'danger',
                        'icon': '🚨',
                        'category': cat.name,
                        'message': f'Budget {cat.name} dépassé ({cur_total:.0f}€ / {limit:.0f}€ — {pct:.0f}%)',
                        'suggestion': f'Transfère depuis "Autres" ou réduis tes dépenses {cat.name.lower()} ce mois-ci.',
                    })
                elif pct >= 80:
                    remaining = limit - cur_total
                    insights.append({
                        'type': 'warning',
                        'icon': '⚠️',
                        'category': cat.name,
                        'message': f'Tu es à {pct:.0f}% de ton budget {cat.name} (reste {remaining:.0f}€)',
                        'suggestion': f'À ce rythme, tu dépasseras ton budget {cat.name} avant la fin du mois.',
                    })

            # Month-over-month comparison
            if prev_total > 0:
                change_pct = (cur_total - prev_total) / prev_total * 100
                if change_pct >= 20:
                    insights.append({
                        'type': 'info',
                        'icon': '📊',
                        'category': cat.name,
                        'message': f'Dépenses {cat.name} en hausse de {change_pct:.0f}% vs le mois dernier',
                        'suggestion': f'Tu as dépensé {cur_total:.0f}€ en {cat.name} contre {prev_total:.0f}€ le mois dernier.',
                    })

        # 2. Global savings rate
        cur_income = float(cur_qs.filter(amount__gt=0).aggregate(t=Sum('amount'))['t'] or 0)
        cur_expense = abs(float(cur_qs.filter(amount__lt=0).aggregate(t=Sum('amount'))['t'] or 0))
        if cur_income > 0:
            savings_rate = (cur_income - cur_expense) / cur_income * 100
            if savings_rate < 10:
                insights.append({
                    'type': 'warning',
                    'icon': '💰',
                    'category': None,
                    'message': f'Taux d\'épargne faible ce mois : {savings_rate:.0f}%',
                    'suggestion': 'Essaie de viser au moins 20% d\'épargne mensuelle.',
                })
            elif savings_rate >= 30:
                insights.append({
                    'type': 'success',
                    'icon': '🎉',
                    'category': None,
                    'message': f'Excellent taux d\'épargne ce mois : {savings_rate:.0f}% !',
                    'suggestion': 'Continue comme ça, tu es sur la bonne voie !',
                })

        return Response({'insights': insights})
