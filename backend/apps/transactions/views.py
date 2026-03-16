from decimal import Decimal
from django.db.models import Sum, Q
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
