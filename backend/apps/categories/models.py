from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

CATEGORY_TYPES = [
    ('income', 'Revenu'),
    ('expense', 'Dépense'),
]


class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories', null=True, blank=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, default='📦')
    color = models.CharField(max_length=7, default='#6366f1')
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='expense')
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['name']

    def __str__(self):
        return f"{self.icon} {self.name}"
