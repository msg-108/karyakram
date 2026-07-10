import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .validators import validate_nepali_phone
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        validators=[
            validate_nepali_phone,
            UniqueValidator(
                queryset=User.objects.all(),
                message="This phone number is already registered."
            )
        ],
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

            # Organizer specific fields
            'organization_name',
            'is_nepali_citizen',
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
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This email is already registered."
            )
        ]
    )
    phone_number = serializers.CharField(validators=[
        validate_nepali_phone,
        UniqueValidator(queryset=User.objects.all(), message="This phone number is already registered.")
    ])

    # NOTE: citizenship_number and pan_number are EncryptedCharField on the
    # model. UniqueValidator runs a DB filter() under the hood, which compares
    # ciphertext, not plaintext. If django-encrypted-model-fields uses a
    # random IV per encryption (likely, since that's standard for proper
    # encryption), two identical plaintext values will NOT produce identical
    # ciphertext -- meaning this filter() may fail to catch real duplicates.
    # Confirm the library's IV behavior before trusting this in production.
    # If non-deterministic, replace with a validate() step that decrypts
    # and compares against existing values instead of relying on a DB match.
    citizenship_number = serializers.CharField(
        required=False,
        allow_null=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This citizenship number is already registered."
            )
        ]
    )
    pan_number = serializers.CharField(
        required=False,
        allow_null=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This PAN number is already registered."
            )
        ]
    )

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
            'is_nepali_citizen',
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
            'is_nepali_citizen': {'required': False},
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