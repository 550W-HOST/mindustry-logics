import cv2
import numpy as np

def get_safe(data, x, y):
    if x < 0:
        return 0
    if y < 0:
        return 0
    return data[x][y]

# Read image
img = cv2.imread('genshin.png')

sx, sy = img.shape[0], img.shape[1]

data = np.zeros((sx, sy))
for i in range(sx):
    for j in range(sy):
        data[i][j] = (img[i][j] <= np.array([200, 200, 200])).all()

def dp(data):
    sx, sy = data.shape[0], data.shape[1]
    result = np.zeros_like(data, dtype=int)
    id = np.zeros_like(data, dtype=int)
    for i in range(sx):
        for j in range(sy):
            rfx, rfy = get_safe(result, i - 1, j), get_safe(result, i, j - 1)
            dfx, dfy = get_safe(data, i - 1, j), get_safe(data, i, j - 1)
            dfd = get_safe(data, i - 1, j - 1)

            val = data[i][j]
            # cat = int(dfx) + int(dfy) + int(dfd)
            cnt = int(dfx) + int(dfy) + int(dfd) + int(val)
            if cnt == 4:
                print('case 4 A')
                result[i][j] = max(rfx, rfy)
            elif cnt == 3:
                print('case 3 C')
                result[i][j] = max(rfx, rfy) + 1
            elif cnt == 2:
                if dfx == dfy:
                    print('case 2 C')
                    result[i][j] = max(rfx, rfy) + 1
                else:
                    if val:
                        print('case 2 B')
                        result[i][j] = max(rfx + (not dfx), rfy + (not dfy))
                    else:
                        print('case 2 A')
                        result[i][j] = max(rfx, rfy)
            elif cnt == 1:
                if val:
                    print('case 1 C')
                    result[i][j] = max(rfx, rfy) + 1
                else:
                    if dfx or dfy:
                        print('case 1 B')
                        result[i][j] = max(rfx + (not dfx), rfy + (not dfy))
                    else:
                        print('case 1 A')
                        result[i][j] = max(rfx, rfy)
            else:
                print('case 0 A')
                result[i][j] = max(rfx, rfy)
            
            if val:
                if dfx and dfy:
                    if rfx > rfy:
                        id[i][j] = id[i - 1][j]
                    else:
                        id[i][j] = id[i][j - 1]
                else:
                    if dfx:
                        id[i][j] = id[i - 1][j]
                    elif dfy:
                        id[i][j] = id[i][j - 1]
                    else:
                        id[i][j] = np.random.randint(1, 2147483647)
            else:
                id[i][j] = 0
    return result, id

# while True:
#     x = np.array(input("enter array: ").split()[:4]).reshape(2, 2).astype(bool)
#     print(dp(x))

result, color_id = dp(data)

random_color = {}

result_img = np.zeros((sx, sy, 3))
for i in range(sx):
    for j in range(sy):
        #  if data[i][j] else [0, 0, 0]
        result_img[i][j] = random_color.setdefault(int(color_id[i][j]), np.random.randint(0, 255, 3)) 
        # print('{:1d}'.format(int(result[i][j]) % 10), end='')
    # print()

cv2.imwrite('genshin-result.png', result_img)


print(result)
                
