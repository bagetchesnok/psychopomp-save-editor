const td = new TextDecoder()

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
            console.log("TODO(mrsteyk): INVENTORY PARSING!")
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
})