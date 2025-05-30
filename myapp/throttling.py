from rest_framework.throttling import BaseThrottle
from django.core.cache import cache
import time

class ProgressiveThrottle(BaseThrottle):
    def get_cache_key(self, request):
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

        # If cooldown expired, clear cooldown but DO NOT reset count
        if data.get('wait_until') and now >= data['wait_until']:
            data['wait_until'] = None

        data['count'] += 1
        data['last_attempt'] = now

        # Progressive wait logic
        if data['count'] == 5:
            data['wait_until'] = now + 60      # 1 minute after 5th fail
        elif data['count'] == 10:
            data['wait_until'] = now + 300     # 5 minutes after 10th fail
        elif data['count'] == 15:
            data['wait_until'] = now + 900     # 15 minutes after 15th fail
        # You can add more steps if you want

        cache.set(key, data, timeout=600)
        return data['wait_until'] is None

    def get_wait_time(self, request):
        key = self.get_cache_key(request)
        data = cache.get(key)
        if data and data.get('wait_until'):
            wait = int(data['wait_until'] - time.time())
            return max(0, wait)
        return 0

    def reset(self, request):
        key = self.get_cache_key(request)
        cache.delete(key)
