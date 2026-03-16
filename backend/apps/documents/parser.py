"""
Service de parsing PDF/CSV avec catégorisation automatique des transactions.
"""
import re
import hashlib
from datetime import datetime
from decimal import Decimal, InvalidOperation

CATEGORIZATION_RULES = {
    "Alimentation": [
        "carrefour", "auchan", "leclerc", "lidl", "monoprix", "restaurant",
        "mcdo", "mcdonald", "burger king", "uber eats", "deliveroo", "just eat",
        "intermarche", "casino", "franprix", "picard", "boulangerie", "traiteur"
    ],
    "Logement": [
        "loyer", "edf", "gdf", "suez", "eau", "charges", "syndic",
        "assurance habitation", "maison", "appartement", "electricite", "gaz"
    ],
    "Transport": [
        "sncf", "ratp", "uber", "essence", "total energies", "bp", "parking",
        "péage", "vinci", "autoroute", "taxi", "blablacar", "ouibus",
        "flixbus", "airfrance", "air france", "easyjet", "transdev"
    ],
    "Loisirs": [
        "netflix", "spotify", "amazon", "fnac", "cinema", "steam", "playstation",
        "xbox", "apple", "itunes", "deezer", "canal+", "mycanal", "twitch",
        "youtube", "disney+", "hbo", "prime video"
    ],
    "Services": [
        "sfr", "orange", "bouygues", "free", "assurance", "mutuelle",
        "abonnement", "banque", "credit", "pret", "assurance vie"
    ],
    "Revenus": [
        "salaire", "virement", "caf", "remboursement", "prime", "allocation",
        "retraite", "pension", "dividende", "revenu"
    ],
    "Santé": [
        "pharmacie", "medecin", "hopital", "clinique", "dentiste", "opticien",
        "docteur", "sante", "secu", "securite sociale", "ameli"
    ],
    "Shopping": [
        "zara", "h&m", "decathlon", "ikea", "leroy merlin", "bricomarche",
        "boulanger", "darty", "maisons du monde", "la redoute", "asos"
    ],
}


def auto_categorize(label: str, categories: list) -> int | None:
    """
    Analyse le libellé de la transaction et retourne l'ID de la catégorie correspondante.
    """
    label_lower = label.lower().strip()

    # Build a name->id map from existing categories
    cat_map = {cat['name']: cat['id'] for cat in categories}

    for cat_name, keywords in CATEGORIZATION_RULES.items():
        for keyword in keywords:
            if keyword in label_lower:
                if cat_name in cat_map:
                    return cat_map[cat_name]

    return None


def parse_amount(value: str) -> Decimal | None:
    """Parse a string amount like '1 234,56' or '-1234.56' into Decimal."""
    try:
        cleaned = re.sub(r'\s', '', str(value))
        cleaned = cleaned.replace(',', '.')
        cleaned = re.sub(r'[^\d.\-+]', '', cleaned)
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def parse_date(value: str) -> datetime | None:
    """Try multiple date formats."""
    formats = [
        '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d',
        '%d/%m/%y', '%d.%m.%Y', '%Y/%m/%d',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(str(value).strip(), fmt)
        except ValueError:
            continue
    return None


def compute_hash(user_id: int, date: str, amount: Decimal, label: str) -> str:
    raw = f"{user_id}-{date}-{amount}-{label.lower().strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def parse_csv(file_path: str, user_id: int, categories: list) -> list:
    """
    Parse a CSV bank statement.
    Attempts to detect columns automatically.
    Returns a list of transaction dicts.
    """
    import pandas as pd

    transactions = []
    separators = [';', ',', '\t', '|']

    df = None
    for sep in separators:
        try:
            df = pd.read_csv(file_path, sep=sep, encoding='utf-8', on_bad_lines='skip')
            if len(df.columns) >= 3:
                break
        except Exception:
            try:
                df = pd.read_csv(file_path, sep=sep, encoding='latin-1', on_bad_lines='skip')
                if len(df.columns) >= 3:
                    break
            except Exception:
                continue

    if df is None or df.empty:
        return []

    # Normalize column names
    df.columns = [str(c).lower().strip() for c in df.columns]

    # Detect date column
    date_col = next((c for c in df.columns if any(k in c for k in ['date', 'jour', 'valeur'])), None)
    # Detect label column
    label_col = next((c for c in df.columns if any(k in c for k in ['libelle', 'label', 'description', 'operation', 'motif'])), None)
    # Detect amount column(s)
    amount_col = next((c for c in df.columns if any(k in c for k in ['montant', 'amount', 'debit', 'credit', 'solde'])), None)
    debit_col = next((c for c in df.columns if 'debit' in c or 'depense' in c), None)
    credit_col = next((c for c in df.columns if 'credit' in c or 'revenu' in c), None)

    if not date_col or not label_col:
        # Fallback: use first 3 columns as date, label, amount
        cols = df.columns.tolist()
        date_col = cols[0] if len(cols) > 0 else None
        label_col = cols[1] if len(cols) > 1 else None
        amount_col = cols[2] if len(cols) > 2 else None

    for _, row in df.iterrows():
        try:
            date_val = parse_date(str(row.get(date_col, '')))
            if not date_val:
                continue

            label = str(row.get(label_col, '')).strip()
            if not label or label in ('nan', 'None', ''):
                continue

            # Handle debit/credit columns
            amount = None
            if debit_col and credit_col:
                debit = parse_amount(str(row.get(debit_col, '') or ''))
                credit = parse_amount(str(row.get(credit_col, '') or ''))
                if credit and credit > 0:
                    amount = credit
                elif debit and debit > 0:
                    amount = -debit
            elif amount_col:
                amount = parse_amount(str(row.get(amount_col, '')))

            if amount is None:
                continue

            date_str = date_val.strftime('%Y-%m-%d')
            tx_hash = compute_hash(user_id, date_str, amount, label)
            category_id = auto_categorize(label, categories)

            transactions.append({
                'date': date_str,
                'label': label,
                'amount': float(amount),
                'hash': tx_hash,
                'category_id': category_id,
                'source': 'import',
            })
        except Exception:
            continue

    return transactions


def parse_pdf(file_path: str, user_id: int, categories: list) -> list:
    """
    Parse a PDF bank statement using pdfplumber.
    Looks for tables or text patterns matching transactions.
    """
    try:
        import pdfplumber
    except ImportError:
        return []

    transactions = []
    # Pattern: date | label | amount
    pattern = re.compile(
        r'(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})\s+'
        r'(.+?)\s+'
        r'([+\-]?\d[\d\s]*[,\.]\d{2})'
    )

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # First try to extract tables
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    row = [str(c).strip() if c else '' for c in row]

                    date_val = None
                    label = None
                    amount = None

                    for cell in row:
                        if not date_val:
                            date_val = parse_date(cell)
                        if not amount:
                            a = parse_amount(cell)
                            if a is not None and cell not in ('', '0'):
                                amount = a

                    # Label is typically the longest cell
                    text_cells = [c for c in row if len(c) > 5]
                    if text_cells:
                        label = max(text_cells, key=len)

                    if date_val and label and amount is not None:
                        date_str = date_val.strftime('%Y-%m-%d')
                        tx_hash = compute_hash(user_id, date_str, amount, label)
                        category_id = auto_categorize(label, categories)
                        transactions.append({
                            'date': date_str,
                            'label': label,
                            'amount': float(amount),
                            'hash': tx_hash,
                            'category_id': category_id,
                            'source': 'import',
                        })

            # Fallback: regex on raw text
            if not transactions:
                text = page.extract_text() or ''
                for match in pattern.finditer(text):
                    date_str_raw, label, amount_str = match.groups()
                    date_val = parse_date(date_str_raw)
                    amount = parse_amount(amount_str)
                    if date_val and amount is not None:
                        date_str = date_val.strftime('%Y-%m-%d')
                        tx_hash = compute_hash(user_id, date_str, amount, label.strip())
                        category_id = auto_categorize(label, categories)
                        transactions.append({
                            'date': date_str,
                            'label': label.strip(),
                            'amount': float(amount),
                            'hash': tx_hash,
                            'category_id': category_id,
                            'source': 'import',
                        })

    return transactions
