from rest_framework.throttling import BaseThrottle
from django.core.cache import cache
import time

class ProgressiveThrottle(BaseThrottle):
    def get_cache_key(self, request):
        # Use user ID if logged in, else use IP address
        if request.user and request.user.is_authenticated:
            return f"throttle_user_{request.user.id}"
        return f"throttle_ip_{request.META.get('REMOTE_ADDR')}"
    
    def allow_request(self, request, view):
        key = self.get_cache_key(request)
        data = cache.get(key)
        now = time.time()

        if data is None:
            data = {'count': 1, 'last_attempt': now, 'wait_until': None}
            cache.set(key, data, timeout=600)
            return True

        # If still in cooldown, reject request
        if data.get('wait_until') and now < data['wait_until']:
            return False

        data['count'] += 1
        data['last_attempt'] = now

        if data['count'] == 5:
            data['wait_until'] = now + 60     # 1-minute wait
        elif data['count'] > 5:
            data['wait_until'] = now + 300    # 5-minute wait

        cache.set(key, data, timeout=600)
        return data['wait_until'] is None
