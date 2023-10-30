import cv2
import numpy as np
import sys


def ndarray_to_mlogjs_str(
    img: np.ndarray, 
    *, 
    output_stream, 
    with_partition_map: bool = False, 
    function_name="drawGenshin"
):
    sx, sy = img.shape[0], img.shape[1]

    assert sx == 176 and sy == 176

    data = np.zeros((sx, sy))
    for i in range(sx):
        for j in range(sy):
            data[i][j] = (img[i][j] <= np.array([240, 240, 240])).all()
    # print(data)

    color_id_map = np.zeros_like(data, dtype=int)

    rectangles = []

    for i in range(sx):
        for j in range(sy):

            if data[i][j]:
                i_end = i
                while i_end < sx and data[i_end][j]:
                    i_end += 1

                j_end = j + 1
                while j_end < sy:
                    flag = False
                    for qi in range(i, i_end):
                        if not data[qi][j_end]:
                            flag = True
                            break
                    if flag:
                        break
                    j_end += 1

                # print('found rectangle at ({:3d}, {:3d}) to ({:3d}, {:3d})'.format(i, j, i_end, j_end))
                rectangles.append((j, sx - 1 - i, j_end - j, i - i_end))
                # print('draw.rect({{ x: {}, y: {}, width: {}, height: {} }})'.format(j, sx - 1 - i, j_end - j, i - i_end))
                cid = np.random.randint(1, 2147483647)
                for si in range(i, i_end):
                    for sj in range(j, j_end):
                        data[si][sj] = False
                        color_id_map[si][sj] = cid

    

    # output_stream.write(f'{function_name}(getBuilding("display1"))\n\n')
    output_stream.write(f'function {function_name}(target, grayscale) {{\n')
    # output_stream.write('    draw.clear(255, 255, 255)\n')
    # output_stream.write('    drawFlush(target)\n')
    output_stream.write('    draw.color(grayscale, grayscale, grayscale)\n')

    buffer_length = 0

    for i in rectangles:
        output_stream.write(
            '    draw.rect({{ x: {}, y: {}, width: {}, height: {} }})\n'.format(*i))
        buffer_length += 1
        if buffer_length >= 240:
            output_stream.write('    drawFlush(target)\n')
            buffer_length = 0
    if rectangles:
        output_stream.write('    drawFlush(target)\n')
    output_stream.write('}\n')

    if with_partition_map:
        random_color = {}
        result_img = np.zeros((sx, sy, 3))
        for i in range(sx):
            for j in range(sy):
                #  if data[i][j] else [0, 0, 0]
                result_img[i][j] = random_color.setdefault(
                    int(color_id_map[i][j]), np.random.randint(0, 255, 3))
                # print('{:1d}'.format(int(result[i][j]) % 10), end='')
            # print()
        return result_img
