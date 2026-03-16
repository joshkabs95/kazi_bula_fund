from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'icon', 'color', 'type', 'is_default', 'budget_limit', 'transaction_count', 'total_amount')
        read_only_fields = ('id', 'is_default')

    def get_transaction_count(self, obj):
        return obj.transactions.count()

    def get_total_amount(self, obj):
        from django.db.models import Sum
        result = obj.transactions.aggregate(total=Sum('amount'))
        return float(result['total'] or 0)
