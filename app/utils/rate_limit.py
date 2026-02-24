from flask import current_app

def check_rate_limit(username: str, action: str, redis_client) -> bool:
    limit = current_app.config['RATE_LIMITS'].get(action)
    if not limit or current_app.debug:
        return False
    key = f"rate:{username}:{action}"
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, 1)
    return current > limit
