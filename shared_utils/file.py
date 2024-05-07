from typing import AsyncIterator

import aiofiles


async def async_iter_file(
    file_path: str, chunk_size: int = 2**22
) -> AsyncIterator[bytes]:
    """
    Asynchronously iterates over chunks of a file.

    This function is an asynchronous generator that reads a file in chunks of a specified size
    and yields these chunks as bytes. It is useful for processing large files in an
    asynchronous manner, which can be beneficial when integrating with other asynchronous
    operations or when trying to maintain responsiveness in an async application.

    :param file_path: The path to the file that will be read.
    :type file_path: str
    :param chunk_size: The size of each chunk to read. Defaults to 4MB (2**22 bytes).
    :type chunk_size: int, optional
    :return: An asynchronous iterator that yields chunks of the file as bytes.
    :rtype: AsyncIterator[bytes]

    Example::

        async def process_large_file(file_path):
            async for chunk in iter_file(file_path, chunk_size=1024):
                # Process each chunk
                print(f"Received chunk of size: {len(chunk)}")

        # Usage in an async context
        asyncio.run(process_large_file('large_file.dat'))

    Note that the function requires Python 3.8 or higher due to the use of the walrus operator (:=).

    Requires:
        - aiofiles (external library for async file operations)

    """
    async with aiofiles.open(file_path, mode='rb') as out_file:
        while chunk := await out_file.read(chunk_size):
            yield chunk
