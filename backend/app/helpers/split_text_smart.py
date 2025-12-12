def split_text_smart(text, max_length=50):
    """
    Divide un texto en partes de como máximo max_length caracteres,
    sin cortar palabras a la mitad.
    """
    words = text.split()
    chunks = []
    current_chunk = ""

    for word in words:
        # Si agregamos la palabra supera el límite, guardamos el chunk actual
        if current_chunk:
            sep = " "
        else:
            sep = ""
        if len(current_chunk) + len(sep) + len(word) > max_length:
            chunks.append(current_chunk)
            current_chunk = word
        else:
            current_chunk += sep + word

    # Agregar el último chunk
    if current_chunk:
        chunks.append(current_chunk)

    return chunks
