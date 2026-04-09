from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# -----------------------------------------
# ASSETY — aktywne połączenia
# -----------------------------------------
active_asset_connections: list[WebSocket] = []


@router.websocket("/ws/assets")
async def assets_websocket(ws: WebSocket):
    await ws.accept()
    active_asset_connections.append(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in active_asset_connections:
            active_asset_connections.remove(ws)


async def broadcast_assets_update():
    disconnected = []
    for ws in active_asset_connections:
        try:
            await ws.send_text("assets_updated")
        except WebSocketDisconnect:
            disconnected.append(ws)

    for ws in disconnected:
        if ws in active_asset_connections:
            active_asset_connections.remove(ws)


# -----------------------------------------
# KONTENERY — aktywne połączenia
# -----------------------------------------
active_container_connections: list[WebSocket] = []


@router.websocket("/ws/containers")
async def containers_websocket(ws: WebSocket):
    await ws.accept()
    active_container_connections.append(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in active_container_connections:
            active_container_connections.remove(ws)


async def broadcast_containers_update():
    disconnected = []
    for ws in active_container_connections:
        try:
            await ws.send_text("containers_updated")
        except WebSocketDisconnect:
            disconnected.append(ws)

    for ws in disconnected:
        if ws in active_container_connections:
            active_container_connections.remove(ws)

# -----------------------------------------
# HISTORIA RUCHÓW — aktywne połączenia
# -----------------------------------------
active_history_connections: list[WebSocket] = []


@router.websocket("/ws/history")
async def history_websocket(ws: WebSocket):
    await ws.accept()
    active_history_connections.append(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in active_history_connections:
            active_history_connections.remove(ws)


async def broadcast_history_update():
    disconnected = []
    for ws in active_history_connections:
        try:
            await ws.send_text("history_updated")
        except WebSocketDisconnect:
            disconnected.append(ws)

    for ws in disconnected:
        if ws in active_history_connections:
            active_history_connections.remove(ws)

# -----------------------------------------
# LOKALIZACJE — aktywne połączenia
# -----------------------------------------
active_location_connections: list[WebSocket] = []


@router.websocket("/ws/locations")
async def locations_websocket(ws: WebSocket):
    await ws.accept()
    active_location_connections.append(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in active_location_connections:
            active_location_connections.remove(ws)


async def broadcast_locations_update():
    disconnected = []
    for ws in active_location_connections:
        try:
            await ws.send_text("locations_updated")
        except WebSocketDisconnect:
            disconnected.append(ws)

    for ws in disconnected:
        if ws in active_location_connections:
            active_location_connections.remove(ws)
