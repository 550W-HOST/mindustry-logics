import cv2
import numpy as np

img = cv2.imread('genshin.png')

sx, sy = img.shape[0], img.shape[1]

data = np.zeros((sx, sy))
for i in range(sx):
    for j in range(sy):
        data[i][j] = (img[i][j] <= np.array([200, 200, 200])).all()
# print(data)

color_id_map = np.zeros_like(data, dtype=int)

print('draw.clear(255, 255, 255)\ndraw.color(0, 0, 0)\n')

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
            print('draw.rect({{ x: {}, y: {}, width: {}, height: {} }})'.format(j, sx - 1 - i, j_end - j, i - i_end))
            cid = np.random.randint(1, 2147483647)
            for si in range(i, i_end):
                for sj in range(j, j_end):
                    data[si][sj] = False
                    color_id_map[si][sj] = cid

random_color = {}
result_img = np.zeros((sx, sy, 3))
for i in range(sx):
    for j in range(sy):
        #  if data[i][j] else [0, 0, 0]
        result_img[i][j] = random_color.setdefault(int(color_id_map[i][j]), np.random.randint(0, 255, 3)) 
        # print('{:1d}'.format(int(result[i][j]) % 10), end='')
    # print()

print('drawFlush()')

cv2.imwrite('genshin-greedy-result.png', result_img)
