import uvicorn

if __name__ == '__main__':
    uvicorn.run('wb.app:app', host='localhost.localdomain', port=9090, reload=True)
