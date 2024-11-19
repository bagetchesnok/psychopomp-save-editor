const td = new TextDecoder()
const te = new TextEncoder()

const ITEMS = [
    {
        "description": "A rusted key. Someone put the rust there on purpose.",
        "height": 2,
        "id": "Key01",
        "image": "res://Sprites/Items/Key.png",
        "name": "Basic Key",
        "usable": "false",
        "width": 1
    },
    {
        "description": "A strange metal block. You don't know what it does, but it must do something, right?",
        "health": -2,
        "height": 1,
        "id": "Block",
        "name": "Metal Block",
        "usable": "true",
        "width": 1
    },
	    {
        "id": "Syringe1",
        "name": "Red Syringe",
        "image": "res://Sprites/Items/Syringe1.png",
        "description": "An unknown syringe, with an unknown bright red fluid in it.",
        "height": 2,
        "width": 1,
        "usable": "true",
        "health": 3,
        "mana": -2,
    },
	    {
        "id": "Syringe2",
        "name": "Purple Syringe",
        "image": "res://Sprites/Items/Syringe2.png",
        "description": "An unknown syringe, with some sort of purple stuff in it?",
        "height": 2,
        "width": 1,
        "usable": "true",
        "health": -2,
        "mana": 2,
    },
    {
        "description": "A rusted, but very special key.",
        "height": 2,
        "id": "QueenKey",
        "image": "res://Sprites/Items/QueenKey.png",
        "name": "Queen Key",
        "usable": "false",
        "width": 1
    },
    {
        "description": "A plastic keycard.",
        "height": 1,
        "id": "KeyCard",
        "image": "res://Sprites/Items/KeyCard.png",
        "name": "Nurse KeyCard",
        "usable": "false",
        "width": 2
    },
    {
        "description": "A smelly Crystal.",
        "height": 1,
        "id": "Sulfur",
        "image": "res://Sprites/Items/Sulfur.png",
        "name": "Sulfur",
        "usable": "false",
        "width": 2
    },
    {
        "description": "A Poisonous Crystal Chemical.",
        "height": 2,
        "id": "DDT",
        "image": "res://Sprites/Items/DDT.png",
        "name": "DDT",
        "usable": "false",
        "width": 1
    },
    {
        "description": "A Noxious Cleaner.",
        "height": 1,
        "id": "Bromine",
        "image": "res://Sprites/Items/Chemical.png",
        "name": "Bromine",
        "usable": "false",
        "width": 1
    },
    {
        "description": "An Empty Syringe, used for collecting DNA Samples.",
        "height": 2,
        "id": "EmptySyringe",
        "image": "res://Sprites/Items/DNA1.png",
        "name": "Empty Syringe",
        "usable": "false",
        "width": 1
    },
    {
        "description": "A container full of valuable DNA information. Don't Drop it.",
        "height": 2,
        "id": "DNASyringe",
        "image": "res://Sprites/Items/DNA2.png",
        "name": "Filled Syringe",
        "usable": "false",
        "width": 1
    },
    {
        "description": "It's not actually a key, but an important component of life.",
        "height": 2,
        "id": "ParagonKey",
        "image": "res://Sprites/Items/ParagonKey.png",
        "name": "Paragon Key",
        "usable": "false",
        "width": 2
    },
];

function readU32LE(a, offset = 0) {
    return a[offset + 0] | (a[offset + 1] << 8) | (a[offset + 2] << 16) | (a[offset + 3] << 24)
}
function readU16LE(a, offset = 0) {
    return a[offset + 0] | (a[offset + 1] << 8)
}

function writeU32LE(a, n, offset = 0) {
    a[offset + 0] = n&0xFF
    a[offset + 1] = (n >> 8)&0xFF
    a[offset + 2] = (n >> 16)&0xFF
    a[offset + 3] = (n >> 24)&0xFF
}

function writeVariantBool(/** @type {Boolean} */ v) {
    const ret = new Uint8Array(8)
    ret[0] = 1
    ret[4] = v ? 1 : 0
    return ret
}

function writeVariantU32(/** @type {Number} */ v) {
    const ret = new Uint8Array(8)
    ret[0] = 2
    writeU32LE(ret, v, 4)
    return ret
}

function writeVariantString(/** @type {String} */ v) {
    const b = te.encode(v)
    const len = b.byteLength
    const len_align = (len + 3) & (~3)
    const ret = new Uint8Array(8 + len_align)
    ret[0] = 4;
    writeU32LE(ret, len, 4);
    ret.set(b, 8)
    return ret
}

function writeVariantArray(v) {
    const a = []
    for (var i = 0; i < v.length; i++) {
        const e = v[i]
        switch (typeof(e)) {
        case 'boolean': {
            a.push(writeVariantBool(e))
        }; break
        case 'number': {
            a.push(writeVariantU32(e))
        }; break
        case 'string': {
            a.push(writeVariantString(e))
        }; break
        case 'object': {
            if (e.length !== undefined && e.findIndex) a.push(writeVariantArray(e))
            else a.push(writeVariantKV(e))
        }; break
        default: {
            console.error("UNKNOWN TYPE", {i, e, t: typeof(e)})
        }; break
        }
    }

    const total_len = a.reduce((pa, e) => pa + e.byteLength, 0)
    const ret = new Uint8Array(8 + total_len)
    ret[0] = 0x1c
    writeU32LE(ret, a.length, 4)
    let offset = 8
    a.forEach((v) => {
        for (var i = 0; i < v.length; i++) ret[offset + i] = v[i]
        offset += v.byteLength
    })

    return ret
}

function writeVariantKV(kv) {
    const kvs = []
    for (const k in kv) {
        kvs.push(writeVariantString(k))
        const e = kv[k]
        switch (typeof(e)) {
        case 'boolean': {
            kvs.push(writeVariantBool(e))
        }; break
        case 'number': {
            kvs.push(writeVariantU32(e))
        }; break
        case 'string': {
            kvs.push(writeVariantString(e))
        }; break
        case 'object': {
            if (e.length !== undefined && e.findIndex) kvs.push(writeVariantArray(e))
            else kvs.push(writeVariantKV(e))
        }; break
        default: {
            console.error("UNKNOWN TYPE", {k, e, t: typeof(e)})
        }; break
        }
    }

    const total_len = kvs.reduce((pa, e) => pa + e.byteLength, 0)
    const ret = new Uint8Array(8 + total_len)
    ret[0] = 0x1b
    writeU32LE(ret, kvs.length / 2, 4)
    let offset = 8
    kvs.forEach((v) => {
        for (var i = 0; i < v.length; i++) ret[offset + i] = v[i]
        offset += v.byteLength
    })

    return ret
}

function createItem(iul, id = undefined, nodeName = undefined) {
    const ili = document.createElement('li')
        
    const select = document.createElement('select')
    for (const k in ITEMS) {
        const e = ITEMS[k]
        const option = document.createElement('option')
        option.value = e['id']
        option.text = e['name']
        option.title = e['description']
        select.appendChild(option)
    }
    ili.appendChild(select)

    const removeBtn = document.createElement('button')
    removeBtn.innerText = "Remove"
    removeBtn.addEventListener('click', () => iul.removeChild(ili))
    ili.appendChild(removeBtn)

    if (id) {
        select.value = id;
    }
    // TODO(mrsteyk): also retain positions in inventory????
    if (nodeName) {
        ili.setAttribute("data-node-name", nodeName);
    }

    return ili
}

function parseItemHtml(/** @type {HTMLLIElement} */ li) {
    return {
        'node_name': li.hasAttribute('data-node-name') ? li.getAttribute('data-node-name') : '_Node_0' + Math.floor(Math.random()*99),
        'protoset': 'res://ItemsNew.tres',
        'prototype_id': li.querySelector('select').value,
    }
}

function getItems(/** @type {HTMLUListElement} */iul) {
    const ii = iul.children
    const a = new Array(ii.length);
    for (var i = 0; i < ii.length; i++) {
        a[i] = parseItemHtml(ii[i])
    }
    return a
}

function parseInner(/** @type {Uint8Array} */ a) {
    const type = readU16LE(a, a.STK_OFFSET)
    const flags = readU16LE(a, a.STK_OFFSET + 2)

    switch(type) {
        /* KV */
        case 0x1b: {
            const len = readU32LE(a, a.STK_OFFSET + 4)
            // console.log("KV", {flags, len})
            a.STK_OFFSET += 8

            let ret = {}
            for (var i = 0; i < len; i++) {
                const k = parseInner(a)
                const v = parseInner(a)
                ret[k] = v
                // console.log("KV", {i, k, v})
            }

            return ret;
        }
        /* arr */
        case 0x1c: {
            const len = readU32LE(a, a.STK_OFFSET + 4)
            // console.log("ARRAY", {flags, len})
            a.STK_OFFSET += 8

            const ret = new Array(len)
            for (var i = 0; i < len; i++) {
                const e = parseInner(a)
                ret[i] = e
                // console.log("ARRAY", {i, e})
            }

            return ret
        }
        /* str */
        case 4: {
            const len = readU32LE(a, a.STK_OFFSET + 4)
            const sb = a.slice(a.STK_OFFSET + 8, a.STK_OFFSET + 8 + len)
            const len_align = (len + 3) & (~3)
            a.STK_OFFSET += 8 + len_align
            const str = td.decode(sb)
            // console.log("STR", {len, len_align, str})
            return str
        }
        /* bool */
        case 1: {
            a.STK_OFFSET += 8
            return !!readU32LE(a, a.STK_OFFSET - 4)
        }
        /* int */
        case 2: {
            if (flags & 1) {
                console.error("OOPS!!! INT64!")
                return -1
            }
            a.STK_OFFSET += 8
            return readU32LE(a, a.STK_OFFSET - 4)
        }
        default: {
            console.error("Unknown", {type, flags})
            return
        }
    }
}

function parse(ab) {
    const a = new Uint8Array(ab)
    a.STK_OFFSET = 0

    const save = parseInner(a)
    // console.log("DECODED SAVE", save)
    document.querySelector("#ds").textContent = JSON.stringify(save, null, 4)

    for (const k in save) {
        if (k == 'InventoryDict') {
            const items = save['InventoryDict']['items']
            const iul = document.querySelector('#items')
            iul.innerHTML = ''
            items.forEach((v) => {
                const nodeName = v['node_name']
                const id = v['prototype_id']
                const ili = createItem(iul, id, nodeName)
                iul.appendChild(ili)
            })
        } else {
            const tp = typeof(save[k])
            const e = document.querySelector(`#${k}`)
            if (!e) console.warn("NULL", {tp, k})
            else if (tp == 'boolean') e.checked = save[k]
            else if (tp == 'number') e.value = save[k]
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('input').addEventListener('change', function() {
        if (this.files.length == 1) {
            const reader = new FileReader()
            reader.onload = function() {
                /** @type {ArrayBuffer} */
                const ab = this.result
                const a = new Uint8Array(ab)

                const bufferSize = readU32LE(a)
                // console.log({bufferSize})
                parse(ab.slice(4, 4 + bufferSize))
            }
            reader.readAsArrayBuffer(this.files[0])
        }
    }, false)

    const iul = document.querySelector('#items')

    document.querySelectorAll('button[type=submit]').forEach((e) => {
        e.addEventListener('click', function() {
            const saveData = {};
            saveData['WonGame'] = document.querySelector('#WonGame').checked
            // saveData['Library'] = document.querySelector('#Library').checked
            saveData['Library'] = false
            saveData['InventoryDict'] = {
                "node_name": "InventoryGrid",
                "item_protoset": "res://ItemsNew.tres",
                "constraints": {
                    "grid_constraint": {
                        "size": "Vector2i(6, 4)"
                    }
                },
                "items": getItems(iul)
            }
            saveData['SaveExist'] = document.querySelector('#SaveExist').checked
            saveData['Keys'] = parseInt(document.querySelector('#Keys').value)
            saveData['MapLayer'] = parseInt(document.querySelector('#MapLayer').value)
            saveData['School'] = document.querySelector('#School').checked
            saveData['Sewer'] = document.querySelector('#Sewer').checked
            saveData['Hospital'] = document.querySelector('#Hospital').checked
            saveData['DNA'] = document.querySelector('#DNA').checked
            saveData['Building'] = document.querySelector('#Building').checked
            // saveData['Symbol'] = document.querySelector('#Symbol').checked
            saveData['Symbol'] = false
            saveData['EmeraldKeys'] = parseInt(document.querySelector('#EmeraldKeys').value)
            console.info('HTML STATE', saveData)

            const kvb = writeVariantKV(saveData)
            console.info('SAVE DATA', kvb)
            kvb.STK_OFFSET = 0
            console.info('PARSED SAVE', parseInner(kvb))
            const data = new Uint8Array(kvb.length + 4)
            for (var i = 0; i < kvb.length; i++) data[4+i] = kvb[i]
            writeU32LE(data, kvb.length, 0)
            const blob = new Blob([data])
            // NOTE(mrsteyk): a hack to download with filename
            const a = document.createElement('a')
            a.download = 'prefs.save'
            a.href = URL.createObjectURL(blob)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        })
    })

    /** @type {HTMLButtonElement} */
    const aibtn = document.querySelector('#addItem')
    aibtn.addEventListener('click', () => {
        const ili = createItem(iul)
        iul.appendChild(ili)
    })
})