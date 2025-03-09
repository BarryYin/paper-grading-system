import hashlib
print(hashlib.sha256('12345'.encode()).hexdigest())
print(hashlib.sha256('123456'.encode()).hexdigest())
print(hashlib.sha256('password'.encode()).hexdigest())