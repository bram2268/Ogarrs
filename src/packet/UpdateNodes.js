var DynamicBuffer = require('./DynamicBuffer');

function UpdateNodes(nodes, nonVisibleNodes, scrambleX, scrambleY, protocolVersion) {
    this.nodes = nodes;
    this.nonVisibleNodes = nonVisibleNodes;
    this.scrambleX = scrambleX;
    this.scrambleY = scrambleY;
    this.protocolVersion = protocolVersion;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function() {
    var buffer = new DynamicBuffer(true); // Little endian included

    buffer.setUint8(16);                                                        // Packet ID

    // Check dead nodes in any case
    var deadCells = [];
    for (var i = 0; i < this.nonVisibleNodes.length; i++) {
        if (!this.nonVisibleNodes[i]) continue;
        if (this.nonVisibleNodes[i].getKiller()) deadCells.push(this.nonVisibleNodes[i]);
    }

    buffer.setUint16(deadCells.length);                                         // Eat actions length
    for (var i = 0; i < deadCells.length; i++) {
        var node = deadCells[i];
        var id = 0;
        if (node.getKiller()) id = node.getKiller().nodeId;
        buffer.setUint32(id);                                                   // Eaten ID
        buffer.setUint32(node.nodeId);                                          // Eater ID
    }

    for (var i = 0; i < this.nodes.length; i++) {                               // Update nodes
        var node = this.nodes[i];
        if (!node) continue; // Error!

        if (node.nodeId == 0) continue; // Error!
        buffer.setUint32(node.nodeId);                                          // Node ID
        buffer.setInt32(node.position.x + this.scrambleX);                      // Node's X pos
        buffer.setInt32(node.position.y + this.scrambleY);                      // Node's Y pos
        buffer.setUint16(node.getSize());                                       // Node size

        var flags = 0;

        if (this.protocolVersion != 5) {
            // Flags
            if (node.getName() != null && node.getName() != "") flags += 8;
            flags += 2;
            if (node.spiked) flags += 1;

            buffer.setUint8(flags);                                             // Node's update flags
            buffer.setUint8(node.color.r);                                      // Node's R color
            buffer.setUint8(node.color.g);                                      // Node's G color
            buffer.setUint8(node.color.b);                                      // Node's B color
            if (node.getName() != null && node.getName() != "") {
                buffer.setStringUTF8(node.getName());                           // Node's name
                buffer.setUint8(0);                                             // Node name terminator
            }
        } else {
            // Flags
            if (node.spiked) flags += 1;

            buffer.setUint8(node.color.r);                                      // Node's R color
            buffer.setUint8(node.color.g);                                      // Node's G color
            buffer.setUint8(node.color.b);                                      // Node's B color
            buffer.setUint8(flags);                                             // Node's update flags
            if (node.getName() != null && node.getName() != "") {
                buffer.setStringUnicode(node.getName());                        // Node's name
            }
            buffer.setUint8(0);                                                 // Node name terminator
        }
    }
    buffer.setUint32(0);                                                        // Update nodes end

    if (this.protocolVersion != 5) {
        buffer.setUint16(this.nonVisibleNodes.length);                          // Remove actions length
    } else {
        buffer.setUint32(this.nonVisibleNodes.length);                          // Remove actions length
    }
    for (var i = 0; i < this.nonVisibleNodes.length; i++) {
        if (!this.nonVisibleNodes[i]) continue;
        buffer.setUint32(this.nonVisibleNodes[i].nodeId);                       // Removing node's ID
    }

    return buffer.build();
};
