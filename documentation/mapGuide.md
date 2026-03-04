## create
this.rooms = new Map();

## push element
this.rooms.set(roomId, room);

## verify if id exist
this.rooms.has(roomId)


## get element 
this.rooms.get(id)

## iterate 
for (const room of this.rooms.values()) 

## delete
this.rooms.delete(id);
