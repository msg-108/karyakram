import re
from rest_framework import serializers


def validate_nepali_phone(value):
    if not value:
        return value

    match = re.match(r'^(?:\+977)?0?([9][0-9]{9})$', value)
    if not match:
        raise serializers.ValidationError(
            "Enter a valid Nepali mobile number (10 digits, starting with 9)."
        )

    local_number = match.group(1)
    return f"+977{local_number}"