import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from .models import User, Organizer, OrganizerApprovalRequest
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

class OrganizerApprovalRequestSerializer(serializers.ModelSerializer):
    """Serializer for approval request status."""
    organizer_name = serializers.CharField(source='organizer.organization_name', read_only=True)
    
    class Meta:
        model = OrganizerApprovalRequest
        fields = [
            'id',
            'organizer_name',
            'status',
            'submitted_at',
            'reviewed_at',
            'admin_comments',
        ]
        read_only_fields = [
            'id',
            'organizer_name',
            'status',
            'submitted_at',
            'reviewed_at',
            'admin_comments',
        ]


class OrganizerProfileSerializer(serializers.ModelSerializer):
    """Serializer for organizer profile management."""
    email = serializers.EmailField(read_only=True)
    approval_status = serializers.SerializerMethodField()
    approval_request = OrganizerApprovalRequestSerializer(read_only=True)

    class Meta:
        model = Organizer
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_email_verified',
            'is_approved_by_admin',
            'approval_status',
            'approval_request',
            'organization_name',
            'organization_description',
            'citizenship_image',
            'citizenship_pdf',
            'pancard_image',
            'pancard_pdf',
            'bank_name',
            'bank_account_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'is_email_verified',
            'is_approved_by_admin',
            'approval_status',
            'created_at',
            'updated_at',
        ]

    def get_approval_status(self, obj):
        try:
            return obj.approval_request.status
        except OrganizerApprovalRequest.DoesNotExist:
            return None


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
    citizenship_image = serializers.ImageField(required=False, allow_null=True)
    citizenship_pdf = serializers.FileField(required=False, allow_null=True)
    pancard_image = serializers.ImageField(required=False, allow_null=True)
    pancard_pdf = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Organizer
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'password_confirm',
            'organization_name',
            'organization_description',
            'citizenship_image',
            'citizenship_pdf',
            'pancard_image',
            'pancard_pdf',
            'bank_name',
            'bank_account_number',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'organization_name': {'required': True},
            'bank_name': {'required': False},
            'bank_account_number': {'required': False},
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
        organizer = Organizer(**validated_data)
        organizer.set_password(password)
        organizer.save()
        
        # Create approval request
        OrganizerApprovalRequest.objects.create(
            organizer=organizer,
            requested_by=None  # Can be set if request context has user
        )
        
        return organizer


# ==================== EMAIL VERIFICATION SERIALIZERS ====================

class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists() and not Organizer.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class VerifyEmailTokenSerializer(serializers.Serializer):
    """Serializer for verifying email token."""
    email = serializers.EmailField()
    token = serializers.CharField(max_length=255)
    
    def validate(self, attrs):
        email = attrs.get('email')
        token = attrs.get('token')
        
        # Try to find user or organizer with this email and token
        user = User.objects.filter(email=email, email_verification_token=token).first()
        if user:
            if user.is_email_verified:
                raise serializers.ValidationError("Email is already verified.")
            return attrs
        
        organizer = Organizer.objects.filter(email=email, email_verification_token=token).first()
        if organizer:
            if organizer.is_email_verified:
                raise serializers.ValidationError("Email is already verified.")
            return attrs
        
        raise serializers.ValidationError("Invalid email or token.")


# ==================== ORGANIZER APPROVAL SERIALIZERS ====================

class OrganizerApprovalStatusSerializer(serializers.ModelSerializer):
    """Serializer for displaying organizer approval status."""
    organizer_name = serializers.CharField(source='organizer.organization_name', read_only=True)
    organizer_email = serializers.CharField(source='organizer.email', read_only=True)
    
    class Meta:
        model = OrganizerApprovalRequest
        fields = [
            'id',
            'organizer_name',
            'organizer_email',
            'status',
            'submitted_at',
            'reviewed_at',
            'admin_comments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class OrganizerApprovalReplySerializer(serializers.Serializer):
    """Serializer for admin to approve/reject organizer applications."""
    approval_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['approved', 'rejected', 'needs_revision'])
    admin_comments = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        if value not in ['approved', 'rejected', 'needs_revision']:
            raise serializers.ValidationError("Invalid status. Choose from: approved, rejected, needs_revision.")
        return value
