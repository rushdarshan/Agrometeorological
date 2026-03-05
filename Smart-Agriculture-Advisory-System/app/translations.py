"""
Multilingual SMS message templates for advisory notifications.
Supports: English (en), Hindi (hi), Gujarati (gu), Marathi (mr).
"""

# Advisory type labels per language
ADVISORY_LABELS = {
    "en": {
        "sowing": "Sowing Advisory",
        "irrigation": "Irrigation Advisory",
        "fertilization": "Fertilization Advisory",
        "pest_alert": "Pest Alert",
        "disease_alert": "Disease Alert",
        "frost_warning": "Frost Warning",
        "heat_stress": "Heat Stress Alert",
    },
    "hi": {
        "sowing": "बुवाई सलाह",
        "irrigation": "सिंचाई सलाह",
        "fertilization": "उर्वरक सलाह",
        "pest_alert": "कीट चेतावनी",
        "disease_alert": "रोग चेतावनी",
        "frost_warning": "पाला चेतावनी",
        "heat_stress": "गर्मी तनाव",
    },
    "gu": {
        "sowing": "વાવણી સલાહ",
        "irrigation": "સિંચાઈ સલાહ",
        "fertilization": "ખાતર સલાહ",
        "pest_alert": "જીવાત ચેતવણી",
        "disease_alert": "રોગ ચેતવણી",
        "frost_warning": "હિમ ચેતવણી",
        "heat_stress": "ગરમી તણાવ",
    },
    "mr": {
        "sowing": "पेरणी सल्ला",
        "irrigation": "सिंचन सल्ला",
        "fertilization": "खत सल्ला",
        "pest_alert": "कीड इशारा",
        "disease_alert": "रोग इशारा",
        "frost_warning": "दंव इशारा",
        "heat_stress": "उष्णता ताण",
    },
}

# Severity labels per language
SEVERITY_LABELS = {
    "en": {"low": "Low", "medium": "Medium", "high": "High"},
    "hi": {"low": "कम", "medium": "मध्यम", "high": "अधिक"},
    "gu": {"low": "ઓછું", "medium": "મધ્યમ", "high": "વધારે"},
    "mr": {"low": "कमी", "medium": "मध्यम", "high": "जास्त"},
}

# SMS templates per language
# Placeholders: {label}, {severity}, {message}, {crop}
SMS_TEMPLATES = {
    "en": "{label} [{severity}]: {message} | Crop: {crop}. Reply 1=Helpful 2=Not helpful",
    "hi": "{label} [{severity}]: {message} | फसल: {crop}. उत्तर दें 1=उपयोगी 2=उपयोगी नहीं",
    "gu": "{label} [{severity}]: {message} | પાક: {crop}. જવાબ આપો 1=ઉપયોગી 2=ઉપયોગી નથી",
    "mr": "{label} [{severity}]: {message} | पीक: {crop}. उत्तर द्या 1=उपयुक्त 2=उपयुक्त नाही",
}


def format_sms(
    advisory_type: str,
    message: str,
    severity: str,
    crop_name: str,
    language: str = "en"
) -> str:
    """
    Format an advisory SMS in the farmer's preferred language.

    Args:
        advisory_type: One of the AdvisoryType enum values
        message: The advisory message text
        severity: low / medium / high
        crop_name: Name of the crop
        language: ISO 639-1 language code (en/hi/gu/mr)

    Returns:
        Formatted SMS string, truncated to 160 chars if needed.
    """
    lang = language if language in SMS_TEMPLATES else "en"

    label = ADVISORY_LABELS.get(lang, ADVISORY_LABELS["en"]).get(advisory_type, advisory_type)
    sev = SEVERITY_LABELS.get(lang, SEVERITY_LABELS["en"]).get(severity, severity)
    template = SMS_TEMPLATES[lang]

    sms = template.format(
        label=label,
        severity=sev,
        message=message,
        crop=crop_name
    )

    # Hard truncate for SMS gateway (160 chars for single SMS)
    if len(sms) > 160:
        sms = sms[:157] + "..."

    return sms
