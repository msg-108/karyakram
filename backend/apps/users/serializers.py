import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from  .validators import validate_nepali_phone

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        validators=[validate_nepali_phone],
        required=False,
        allow_null=True,
    )
    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'username',
            'email',
            'phone_number',
            'date_of_birth',
            'role',
            'is_email_verified',
            'is_phone_verified',
            'created_at',
            'updated_at',

        #     Organizer specific fields
            'organization_name',
            'citizenship',
            'citizenship_number',
            'pan_number',
            'bank_name',
            'bank_account_number',
            'is_organizer_approved',
        ]


        read_only_fields = [
            'id',
            'email',
            'role',
            'created_at',
            'updated_at',
            'is_organizer_approved',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(validators=[validate_nepali_phone])

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'username',
            'email',
            'password',
            'password_confirm',
            'phone_number',
            'date_of_birth',
            'role',
            # Organizer specific fields
            'organization_name',
            'citizenship',
            'citizenship_number',
            'pan_number',
            'bank_name',
            'bank_account_number',
        ]

        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': True},
            'date_of_birth': {'required': True},
            'role': {'required': False, 'choices': ['user', 'organizer']},
            # Organizer fields are optional here, validated in validate()
            'organization_name': {'required': False},
            'citizenship': {'required': False},
            'citizenship_number': {'required': False},
            'pan_number': {'required': False},
            'bank_name': {'required': False},
            'bank_account_number': {'required': False},
        }

    def validate_pan_number(self, value):
        if value and (not value.isdigit() or len(value) != 9):
            raise serializers.ValidationError("PAN number must be exactly 9 digits.")
        return value

    def validate(self, attrs):
        # Check if passwords match
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Password fields didn't match."})

        # If role is organizer, validate organizer specific fields
        if attrs.get('role') == 'organizer':
            required_fields = [
                'organization_name',
                'citizenship',
                'citizenship_number',
                'pan_number',
                'bank_name',
                'bank_account_number',
            ]
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError({field: f"{field.replace('_', ' ').capitalize()} is required for organizers."})
        else:
            # Clear organizer fields for non-organizer users
            organizer_fields = [
                'organization_name',
                'citizenship',
                'citizenship_number',
                'pan_number',
                'bank_name',
                'bank_account_number',
            ]
            for field in organizer_fields:
                attrs[field] = None

        return attrs

    def create(self, validated_data):
        # Remove password_confirm as it's not a User model field
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)  # hashes the password properly
        user.save()

        return user