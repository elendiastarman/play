from django.shortcuts import render
from django.conf import settings

import os
import re


# Create your views here.
def tametsi_home_view(request, **kwargs):
    context = {}
    path = os.path.join(settings.BASE_DIR, "general", "static", "general", "tametsi")

    # Structure example:
    # groups: {
    #   '2018-11-23': {
    #     'zip': '20181123_example.zip',
    #     'puzzles': [
    #       ['<filename>', <thing to sort by>],
    #       ['20181123_filename-size-is-6x6-score-is-23.57.puz', (6, 23.57)],
    #     ],
    #   },
    # }
    groups = {}
    for filename in os.listdir(path):
        prefix = filename[:8]  # Assumed to be YYYYMMDD
        datestr = "{}-{}-{}".format(prefix[:4], prefix[4:6], prefix[6:])

        if filename.endswith('.zip'):
            groups.setdefault(datestr, {})['zip'] = filename
        elif filename.endswith('.puz'):
            groups.setdefault(datestr, {}).setdefault('puzzles', []).append([filename, 0])

            if 'Combination-Lock' in filename:
                size = int(re.search(r'(\d+)x\1', filename).group(1))
                score = float(re.search(r'(\d+\.\d+)', filename).group(1))
                groups[datestr]['puzzles'][-1][1] = (size, score)

    for puzzle_set in groups.values():
        puzzle_set['puzzles'].sort(key=lambda _: _[1])

    context['groups'] = [[key, groups[key]] for key in sorted(groups.keys())]

    return render(request, 'general/tametsi_home.html', context)
