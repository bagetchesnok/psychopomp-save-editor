const td = new TextDecoder()

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
        const idx = ITEMS.findIndex((v) => v.id == id);
        select.value = ITEMS[idx].id;
        select.selectedIndex = idx;
    }
    if (nodeName) {
        ili.setAttribute("data-node-name", nodeName);
    }

    return ili
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
                console.log("OOPS!!! INT64!")
                return -1
            }
            a.STK_OFFSET += 8
            return readU32LE(a, a.STK_OFFSET - 4)
        }
        default: {
            console.log("Unknown", {type, flags})
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
            if (!e) console.log("NULL", {tp, k})
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
    document.querySelectorAll('button[type=submit]').forEach((e) => {
        // TODO(mrsteyk): saving!
    })

    /** @type {HTMLButtonElement} */
    const aibtn = document.querySelector('#addItem')
    const iul = document.querySelector('#items')
    aibtn.addEventListener('click', () => {
        const ili = createItem(iul)
        iul.appendChild(ili)
    })
})