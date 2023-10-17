import pic_to_mlogjs
import sys
import cv2

def generate_collage(
    img,
    *,
    output, 
    include_calls: bool = True,
):
    w, h = img.shape[:2]
    assert w % 176 == 0 and h % 176 == 0

    wcnt = w // 176
    hcnt = h // 176

    caller_ctr = 1
    if include_calls:
        for i in range(wcnt):
            for j in range(hcnt):
                output.write(f'drawGenshin{i}_{j}(getBuilding("display{caller_ctr}"), 0)\n')    
                caller_ctr += 1

    for i in range(wcnt):
        for j in range(hcnt):
            pic_to_mlogjs.ndarray_to_mlogjs_str(
                img[i * 176: (i + 1) * 176, j * 176: (j + 1) * 176],
                output_stream=output,
                function_name=f'drawGenshin{i}_{j}',
            )


def main():
    if len(sys.argv) == 1 or sys.argv[1] == '--help':
        print('Usage: python collage_generator.py <input> <output>')
        exit(0)
    elif len(sys.argv) != 3:
        print('Error: invalid number of arguments')
        exit(1)

    img = cv2.imread(sys.argv[1])
    with open(sys.argv[2], 'w') as output:
        generate_collage(img, output=output)

if __name__ == '__main__':
    main()