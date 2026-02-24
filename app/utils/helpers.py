import uuid

def is_valid_uuid(val):
    try:
        uuid.UUID(val)
        return True
    except ValueError:
        return False

def format_time(iso_string):
    pass
