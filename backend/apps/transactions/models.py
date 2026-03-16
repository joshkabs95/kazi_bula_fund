import hashlib
from django.db import models
from django.contrib.auth import get_user_model
from apps.categories.models import Category

User = get_user_model()

SOURCE_CHOICES = [
    ('manual', 'Manuel'),
    ('import', 'Import'),
]


class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    label = models.CharField(max_length=255)
    date = models.DateField()
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='manual')
    hash = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.hash:
            raw = f"{self.user_id}-{self.date}-{self.amount}-{self.label.lower().strip()}"
            self.hash = hashlib.sha256(raw.encode()).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} | {self.label} | {self.amount}€"
