import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from .parser import parse_csv, parse_pdf
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.transactions.models import Transaction


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']
        file_type = 'pdf' if file.name.lower().endswith('.pdf') else 'csv'

        doc = Document.objects.create(
            user=request.user,
            file=file,
            file_type=file_type,
            status='pending',
        )

        try:
            categories_qs = Category.objects.filter(
                user=request.user
            ) | Category.objects.filter(is_default=True)
            categories = [{'id': c.id, 'name': c.name} for c in categories_qs]

            file_path = doc.file.path

            if file_type == 'csv':
                transactions = parse_csv(file_path, request.user.id, categories)
            else:
                transactions = parse_pdf(file_path, request.user.id, categories)

            doc.transaction_count = len(transactions)
            doc.status = 'processed'
            doc.save()

            return Response({
                'document_id': doc.id,
                'transaction_count': len(transactions),
                'transactions': transactions,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            doc.status = 'error'
            doc.error_message = str(e)
            doc.save()
            return Response({'detail': f'Erreur de parsing: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @action(detail=True, methods=['get'], url_path='preview')
    def preview(self, request, pk=None):
        doc = self.get_object()
        if doc.status not in ('processed', 'imported'):
            return Response({'detail': 'Document non traité.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            categories_qs = Category.objects.filter(
                user=request.user
            ) | Category.objects.filter(is_default=True)
            categories = [{'id': c.id, 'name': c.name} for c in categories_qs]

            file_path = doc.file.path
            if doc.file_type == 'csv':
                transactions = parse_csv(file_path, request.user.id, categories)
            else:
                transactions = parse_pdf(file_path, request.user.id, categories)

            # Mark already imported ones
            existing_hashes = set(
                Transaction.objects.filter(user=request.user).values_list('hash', flat=True)
            )
            for tx in transactions:
                tx['already_imported'] = tx.get('hash') in existing_hashes

            return Response({'transactions': transactions, 'total': len(transactions)})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    @action(detail=True, methods=['post'], url_path='import')
    def import_transactions(self, request, pk=None):
        doc = self.get_object()
        selected = request.data.get('transactions', [])

        if not selected:
            return Response({'detail': 'Aucune transaction sélectionnée.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_hashes = set(
            Transaction.objects.filter(user=request.user).values_list('hash', flat=True)
        )

        created = 0
        skipped = 0

        for tx_data in selected:
            tx_hash = tx_data.get('hash')
            if tx_hash and tx_hash in existing_hashes:
                skipped += 1
                continue

            category_id = tx_data.get('category_id')
            try:
                Transaction.objects.create(
                    user=request.user,
                    category_id=category_id,
                    amount=tx_data['amount'],
                    label=tx_data['label'],
                    date=tx_data['date'],
                    source='import',
                    hash=tx_hash,
                )
                if tx_hash:
                    existing_hashes.add(tx_hash)
                created += 1
            except Exception:
                skipped += 1

        doc.status = 'imported'
        doc.transaction_count = created
        doc.save()

        return Response({
            'imported': created,
            'skipped': skipped,
            'message': f'{created} transaction(s) importée(s), {skipped} ignorée(s) (doublons).',
        })
