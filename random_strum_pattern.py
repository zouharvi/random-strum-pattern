#!/usr/bin/env python3

import random
import argparse

args = argparse.ArgumentParser()
args.add_argument("-s", "--strums", default=4, type=int)
args = args.parse_args()

# assume 4/4
pattern_all = list(enumerate("DUDUDUDU"))
pattern_sig = "1+2+3+4+"
pattern = random.sample(pattern_all[1:], args.strums)
pattern.append(pattern_all[0])

pattern_new = [" " for _ in pattern_all]
for i, c in pattern:
    pattern_new[i] = c

# fix the first downstrum

print(pattern_sig)
print("".join(pattern_new))