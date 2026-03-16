"""
Management command to seed the database with default categories and sample transactions.
Usage: python manage.py seed
"""
import random
from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.categories.models import Category
from apps.transactions.models import Transaction

User = get_user_model()

DEFAULT_CATEGORIES = [
    {'name': 'Alimentation', 'icon': '🛒', 'color': '#f97316', 'type': 'expense'},
    {'name': 'Logement', 'icon': '🏠', 'color': '#6366f1', 'type': 'expense'},
    {'name': 'Transport', 'icon': '🚗', 'color': '#3b82f6', 'type': 'expense'},
    {'name': 'Loisirs', 'icon': '🎮', 'color': '#a855f7', 'type': 'expense'},
    {'name': 'Services', 'icon': '📱', 'color': '#ec4899', 'type': 'expense'},
    {'name': 'Santé', 'icon': '💊', 'color': '#10b981', 'type': 'expense'},
    {'name': 'Shopping', 'icon': '👗', 'color': '#f59e0b', 'type': 'expense'},
    {'name': 'Revenus', 'icon': '💰', 'color': '#22c55e', 'type': 'income'},
    {'name': 'Autres', 'icon': '📦', 'color': '#6b7280', 'type': 'expense'},
]

SAMPLE_TRANSACTIONS = [
    {'label': 'Salaire mensuel', 'cat': 'Revenus', 'amounts': [2800, 2900, 3000]},
    {'label': 'Prime trimestrielle', 'cat': 'Revenus', 'amounts': [500]},
    {'label': 'Carrefour Market', 'cat': 'Alimentation', 'amounts': [-45.50, -62.30, -38.90]},
    {'label': 'Monoprix', 'cat': 'Alimentation', 'amounts': [-23.40, -31.20]},
    {'label': 'Uber Eats', 'cat': 'Alimentation', 'amounts': [-18.90, -24.50]},
    {'label': 'Restaurant Le Zinc', 'cat': 'Alimentation', 'amounts': [-35.00, -42.00]},
    {'label': 'Loyer mensuel', 'cat': 'Logement', 'amounts': [-850]},
    {'label': 'EDF Électricité', 'cat': 'Logement', 'amounts': [-65.00, -72.00]},
    {'label': 'Assurance habitation', 'cat': 'Logement', 'amounts': [-35.50]},
    {'label': 'RATP Navigo', 'cat': 'Transport', 'amounts': [-86.40]},
    {'label': 'Uber', 'cat': 'Transport', 'amounts': [-12.50, -8.90, -15.00]},
    {'label': 'Essence Total', 'cat': 'Transport', 'amounts': [-55.00, -60.00]},
    {'label': 'Netflix', 'cat': 'Loisirs', 'amounts': [-17.99]},
    {'label': 'Spotify', 'cat': 'Loisirs', 'amounts': [-9.99]},
    {'label': 'Cinema UGC', 'cat': 'Loisirs', 'amounts': [-13.50, -27.00]},
    {'label': 'Amazon Prime', 'cat': 'Loisirs', 'amounts': [-6.99]},
    {'label': 'Forfait SFR', 'cat': 'Services', 'amounts': [-20.99]},
    {'label': 'Mutuelle santé', 'cat': 'Services', 'amounts': [-45.00]},
    {'label': 'Pharmacie', 'cat': 'Santé', 'amounts': [-15.30, -28.90]},
    {'label': 'Médecin généraliste', 'cat': 'Santé', 'amounts': [-25.00]},
    {'label': 'Zara', 'cat': 'Shopping', 'amounts': [-59.99, -89.99]},
    {'label': 'Decathlon', 'cat': 'Shopping', 'amounts': [-45.00, -120.00]},
]


class Command(BaseCommand):
    help = 'Seed database with default categories and sample transactions'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='demo@budget.fr', help='Demo user email')
        parser.add_argument('--password', default='Demo1234!', help='Demo user password')
        parser.add_argument('--months', type=int, default=6, help='Number of months of data')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        months = options['months']

        # Create default categories (global)
        self.stdout.write('Creating default categories...')
        cat_map = {}
        for cat_data in DEFAULT_CATEGORIES:
            cat, created = Category.objects.get_or_create(
                name=cat_data['name'],
                is_default=True,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'type': cat_data['type'],
                    'user': None,
                }
            )
            cat_map[cat.name] = cat
            if created:
                self.stdout.write(f'  ✓ {cat}')

        # Create demo user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': 'demo',
                'first_name': 'Demo',
                'last_name': 'User',
            }
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f'Created demo user: {email} / {password}')
        else:
            self.stdout.write(f'Demo user already exists: {email}')

        # Generate transactions for past N months
        self.stdout.write(f'Generating {months} months of transactions...')
        today = date.today()
        created_count = 0

        for month_offset in range(months):
            month_date = date(today.year, today.month, 1) - timedelta(days=30 * month_offset)

            for tx_template in SAMPLE_TRANSACTIONS:
                cat = cat_map.get(tx_template['cat'])
                amount = Decimal(str(random.choice(tx_template['amounts'])))

                # Vary the day of month
                day = random.randint(1, 28)
                tx_date = date(month_date.year, month_date.month, day)

                import hashlib
                raw = f"{user.id}-{tx_date}-{amount}-{tx_template['label'].lower().strip()}"
                tx_hash = hashlib.sha256(raw.encode()).hexdigest()

                tx, created_tx = Transaction.objects.get_or_create(
                    hash=tx_hash,
                    defaults={
                        'user': user,
                        'category': cat,
                        'amount': amount,
                        'label': tx_template['label'],
                        'date': tx_date,
                        'source': 'manual',
                    }
                )
                if created_tx:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seed completed! {created_count} transactions created.'
            f'\n   Demo login: {email} / {password}'
        ))
