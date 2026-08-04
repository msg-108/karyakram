from rest_framework import serializers

class PaymentInitiateSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["ESEWA", "KHALTI"])

class PaymentVerifySerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["ESEWA", "KHALTI"])
    pidx = serializers.CharField(required=False, help_text="Required for Khalti")
