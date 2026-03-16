from rest_framework import serializers
from .models import Transaction
from apps.categories.serializers import CategorySerializer


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Transaction
        fields = (
            'id', 'category', 'category_detail', 'amount', 'label',
            'date', 'source', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'source')

    def validate_amount(self, value):
        if value == 0:
            raise serializers.ValidationError("Le montant ne peut pas être zéro.")
        return value


class TransactionStatsSerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    by_category = serializers.ListField()
    by_month = serializers.ListField()
