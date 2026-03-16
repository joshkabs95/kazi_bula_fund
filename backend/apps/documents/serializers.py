from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'file', 'file_type', 'status', 'imported_at', 'transaction_count', 'error_message')
        read_only_fields = ('id', 'status', 'imported_at', 'transaction_count', 'error_message', 'file_type')


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        name = value.name.lower()
        if not (name.endswith('.pdf') or name.endswith('.csv')):
            raise serializers.ValidationError("Seuls les fichiers PDF et CSV sont acceptés.")
        return value
