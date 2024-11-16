import struct
import sys

FORMAT_BIT_STREAM = 1 << 22
FORMAT_BIT_HAS_MIPMAPS = 1 << 23
FORMAT_BIT_DETECT_3D = 1 << 24
# FORMAT_BIT_DETECT_SRGB = 1 << 25
FORMAT_BIT_DETECT_NORMAL = 1 << 26
FORMAT_BIT_DETECT_ROUGNESS = 1 << 27

DATA_FORMAT_IMAGE = 0
DATA_FORMAT_PNG = 1
DATA_FORMAT_WEBP = 2
DATA_FORMAT_BASIS_UNIVERSAL = 3

"""
for i,e in enumerate(a):
    print(e.strip().replace(',', f' = {i}').replace('//', '#'))
"""

FORMAT_L8 = 0 # Luminance
FORMAT_LA8 = 1 # Luminance-Alpha
FORMAT_R8 = 2
FORMAT_RG8 = 3
FORMAT_RGB8 = 4
FORMAT_RGBA8 = 5
FORMAT_RGBA4444 = 6
FORMAT_RGB565 = 7
FORMAT_RF = 8 # Float
FORMAT_RGF = 9
FORMAT_RGBF = 10
FORMAT_RGBAF = 11
FORMAT_RH = 12 # Half
FORMAT_RGH = 13
FORMAT_RGBH = 14
FORMAT_RGBAH = 15
FORMAT_RGBE9995 = 16
FORMAT_DXT1 = 17 # BC1
FORMAT_DXT3 = 18 # BC2
FORMAT_DXT5 = 19 # BC3
FORMAT_RGTC_R = 20 # BC4
FORMAT_RGTC_RG = 21 # BC5
FORMAT_BPTC_RGBA = 22 # BC7
FORMAT_BPTC_RGBF = 23 # BC6 Signed
FORMAT_BPTC_RGBFU = 24 # BC6 Unsigned
FORMAT_ETC = 25 # ETC1
FORMAT_ETC2_R11 = 26
FORMAT_ETC2_R11S = 27 # Signed = 27 NOT srgb.
FORMAT_ETC2_RG11 = 28
FORMAT_ETC2_RG11S = 29 # Signed = 29 NOT srgb.
FORMAT_ETC2_RGB8 = 30
FORMAT_ETC2_RGBA8 = 31
FORMAT_ETC2_RGB8A1 = 32
FORMAT_ETC2_RA_AS_RG = 33 # ETC2 RGBA with a RA-RG swizzle for normal maps.
FORMAT_DXT5_RA_AS_RG = 34 # BC3 with a RA-RG swizzle for normal maps.
FORMAT_ASTC_4x4 = 35
FORMAT_ASTC_4x4_HDR = 36
FORMAT_ASTC_8x8 = 37
FORMAT_ASTC_8x8_HDR = 38
FORMAT_MAX = 39

format_names = [
    "Lum8",
	"LumAlpha8",
	"Red8",
	"RedGreen",
	"RGB8",
	"RGBA8",
	"RGBA4444",
	"RGBA5551 (Actually RGB565)", # Actually RGB565, kept as RGBA5551 for compatibility.
	"RFloat",
	"RGFloat",
	"RGBFloat",
	"RGBAFloat",
	"RHalf",
	"RGHalf",
	"RGBHalf",
	"RGBAHalf",
	"RGBE9995",
	"DXT1 RGB8",
	"DXT3 RGBA8",
	"DXT5 RGBA8",
	"RGTC Red8",
	"RGTC RedGreen8",
	"BPTC_RGBA",
	"BPTC_RGBF",
	"BPTC_RGBFU",
	"ETC",
	"ETC2_R11",
	"ETC2_R11S",
	"ETC2_RG11",
	"ETC2_RG11S",
	"ETC2_RGB8",
	"ETC2_RGBA8",
	"ETC2_RGB8A1",
	"ETC2_RA_AS_RG",
	"FORMAT_DXT5_RA_AS_RG",
	"ASTC_4x4",
	"ASTC_4x4_HDR",
	"ASTC_8x8",
	"ASTC_8x8_HDR",
]

if __name__ == "__main__":
    fname = sys.argv[1]
    print("Opening", fname)
    a = open(fname, "rb").read()
    if a[:4] != b"GST2":
        print("Invalid header!")
        exit(-1)
    
    format_version, width, height, flags, p_limit_mipmap = struct.unpack("IIIIi", a[4:4*6])
    print("Format Version:", format_version)
    assert format_version == 1
    print("WxH:", width, height)
    print("Flags:", bin(flags))
    if flags & FORMAT_BIT_STREAM:
        print("\tFlag FORMAT_BIT_STREAM")
    if flags & FORMAT_BIT_HAS_MIPMAPS:
        print("\tFlag FORMAT_BIT_HAS_MIPMAPS")
    if flags & FORMAT_BIT_DETECT_3D:
        print("\tFlag FORMAT_BIT_DETECT_3D")
    if flags & FORMAT_BIT_DETECT_NORMAL:
        print("\tFlag FORMAT_BIT_DETECT_NORMAL")
    if flags & FORMAT_BIT_DETECT_ROUGNESS:
        print("\tFlag FORMAT_BIT_DETECT_ROUGNESS")
    print("p_limit_mipmap", p_limit_mipmap)

    a = a[4*9:]
    print('--- CTEX ---')

    data_format, pic_width, pic_height, mipmap_count, pic_format = struct.unpack("IHHII", a[:16])
    print("Data Format:", data_format)
    if data_format == DATA_FORMAT_IMAGE:
        print("\tDATA_FORMAT_IMAGE")
    if data_format == DATA_FORMAT_PNG:
        print("\tDATA_FORMAT_PNG")
    if data_format == DATA_FORMAT_WEBP:
        print("\tDATA_FORMAT_WEBP")
    if data_format == DATA_FORMAT_BASIS_UNIVERSAL:
        print("\tDATA_FORMAT_BASIS_UNIVERSAL")
    print("WxH:", pic_width, pic_height)
    print("MipMap count:", mipmap_count)
    print("Image Format:", pic_format)
    print(f"\t{format_names[pic_format]}")

    a = a[16:]
    print('--- LAST IMAGE ---')

    # I only care about last mipmap
    pic_data = None
    for _ in range(mipmap_count + 1):
        pic_data_len = struct.unpack("I", a[:4])[0]
        pic_data = a[4:4+pic_data_len]
        a = a[4+pic_data_len:]
    
    print("Size:", len(pic_data))
    if data_format == DATA_FORMAT_WEBP:
        ofname = fname + '.webp'
        print("Saving as WEBP:", ofname)
        open(ofname, "wb").write(pic_data)
    elif data_format == DATA_FORMAT_PNG:
        ofname = fname + '.png'
        print("Saving as PNG:", ofname)
        open(ofname, "wb").write(pic_data)
    else:
        print("UNKNOWN FORMAT!!!")
