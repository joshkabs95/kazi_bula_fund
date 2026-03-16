from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

FILE_TYPES = [
    ('pdf', 'PDF'),
    ('csv', 'CSV'),
]

DOCUMENT_STATUS = [
    ('pending', 'En attente'),
    ('processed', 'Traité'),
    ('imported', 'Importé'),
    ('error', 'Erreur'),
]


class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='documents/%Y/%m/')
    file_type = models.CharField(max_length=5, choices=FILE_TYPES)
    status = models.CharField(max_length=10, choices=DOCUMENT_STATUS, default='pending')
    error_message = models.TextField(blank=True, null=True)
    imported_at = models.DateTimeField(auto_now_add=True)
    transaction_count = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-imported_at']

    def __str__(self):
        return f"{self.file_type.upper()} - {self.imported_at.strftime('%Y-%m-%d %H:%M')}"
