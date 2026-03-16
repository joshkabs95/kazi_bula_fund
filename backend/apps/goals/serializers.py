from rest_framework import serializers
from .models import Goal, GoalContribution
from datetime import date
from dateutil.relativedelta import relativedelta


class GoalContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalContribution
        fields = ['id', 'amount', 'note', 'date']
        read_only_fields = ['date']


class GoalSerializer(serializers.ModelSerializer):
    progress_pct = serializers.ReadOnlyField()
    remaining = serializers.ReadOnlyField()
    contributions = GoalContributionSerializer(many=True, read_only=True)
    forecast_date = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'target_amount', 'current_amount', 'deadline',
            'icon', 'color', 'created_at', 'progress_pct', 'remaining',
            'contributions', 'forecast_date',
        ]
        read_only_fields = ['created_at', 'progress_pct', 'remaining']

    def get_forecast_date(self, obj):
        """
        Based on average monthly contribution, forecast when goal will be reached.
        """
        contribs = obj.contributions.order_by('date')
        if contribs.count() < 2:
            return None

        # Monthly average from contributions
        total = sum(float(c.amount) for c in contribs)
        months = max(1, (date.today() - contribs.first().date).days / 30)
        monthly_avg = total / months

        if monthly_avg <= 0:
            return None

        remaining = float(obj.remaining)
        months_needed = remaining / monthly_avg
        forecast = date.today() + relativedelta(months=round(months_needed))
        return forecast.isoformat()
