import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from .models import User, Organizer
from .validators import validate_nepali_phone


# ==================== USER SERIALIZERS ====================

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for standard user profile management."""
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_email_verified',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'is_email_verified',
            'created_at',
            'updated_at',
        ]


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This email is already registered."
            )
        ]
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords don't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ==================== ORGANIZER SERIALIZERS ====================

class OrganizerProfileSerializer(serializers.ModelSerializer):
    """Serializer for organizer profile management."""
    email = serializers.EmailField(read_only=True)
    phone_number = serializers.CharField(read_only=True)

    class Meta:
        model = Organizer
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'is_email_verified',
            'is_phone_verified',
            'is_approved_by_admin',
            'organization_name',
            'organization_description',
            'citizenship_number',
            'pan_number',
            'bank_name',
            'bank_account_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'phone_number',
            'is_email_verified',
            'is_phone_verified',
            'is_approved_by_admin',
            'created_at',
            'updated_at',
        ]


class OrganizerRegisterSerializer(serializers.ModelSerializer):
    """Serializer for organizer registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=Organizer.objects.all(),
                message="This email is already registered."
            )
        ]
    )
    phone_number = serializers.CharField(
        required=True,
        validators=[
            validate_nepali_phone,
            UniqueValidator(
                queryset=Organizer.objects.all(),
                message="This phone number is already registered."
            )
        ]
    )
    citizenship_number = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=Organizer.objects.all(),
                message="This citizenship number is already registered."
            )
        ]
    )
    pan_number = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=Organizer.objects.all(),
                message="This PAN number is already registered."
            )
        ]
    )

    class Meta:
        model = Organizer
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'password',
            'password_confirm',
            'organization_name',
            'organization_description',
            'citizenship_number',
            'pan_number',
            'bank_name',
            'bank_account_number',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'organization_name': {'required': True},
            'citizenship_number': {'required': True},
            'pan_number': {'required': True},
            'bank_name': {'required': True},
            'bank_account_number': {'required': True},
        }

    def validate_pan_number(self, value):
        if not value.isdigit() or len(value) != 9:
            raise serializers.ValidationError(
                "PAN number must be exactly 9 digits."
            )
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords don't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        organizer = Organizer(**validated_data)
        organizer.set_password(password)
        organizer.save()
        return organizer
