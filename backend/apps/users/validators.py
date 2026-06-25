import re
from rest_framework import serializers

def validate_nepali_phone(value):
    if value and not re.match(r'^\+977[0-9]{9,10}$|^0?[0-9]{9,10}$', value):
        raise serializers.ValidationError("Enter a valid Nepali phone number.")
    return value

