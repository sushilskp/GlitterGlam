test_bytes = b'\xc3\x83\xc2\xa2\xc3\x85\xe2\x80\x9c\xc3\x82\xc2\xa6'
text = test_bytes.decode('utf-8')
print('Decoded:', repr(text))
print('Length:', len(text))
print('Chars:', [hex(ord(c)) for c in text])
