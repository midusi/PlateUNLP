from datetime import datetime

def validate_date(test_str):
    format = "%Y-%m-%d"
    try:
        ok = bool(datetime.strptime(test_str, format))
    except ValueError:
        ok = False
    return ok

def validate_time(test_str):
    format = "%H:%M:%S"
    try:
        ok = bool(datetime.strptime(test_str, format))
    except ValueError:
        ok = False
    return ok