from rest_framework import serializers


class PaymentInitiateSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["ESEWA"])


class PaymentVerifySerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["ESEWA"])


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Payment

        model = Payment
        fields = [
            "reference_id",
            "booking_id",
            "provider",
            "amount",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
