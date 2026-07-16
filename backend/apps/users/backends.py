from django.contrib.auth.backends import ModelBackend
from .models import User, Organizer


class DualModelBackend(ModelBackend):
    """
    Custom authentication backend that supports both User and Organizer models.
    Allows login with either a User or Organizer account.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate against both User and Organizer models.
        """
        # Try User model first
        try:
            user = User.objects.get(username=username)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            pass
        
        # Try Organizer model
        try:
            organizer = Organizer.objects.get(username=username)
            if organizer.check_password(password) and self.user_can_authenticate(organizer):
                return organizer
        except Organizer.DoesNotExist:
            pass
        
        return None
    
    def get_user(self, user_id):
        """
        Retrieve user by ID from either User or Organizer model.
        """
        # Try User model first
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            pass
        
        # Try Organizer model
        try:
            return Organizer.objects.get(pk=user_id)
        except Organizer.DoesNotExist:
            pass
        
        return None
