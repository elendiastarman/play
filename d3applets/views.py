from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.conf import settings

from django.template import TemplateDoesNotExist
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt

from pymongo import MongoClient

import os
import re
import ast
import sys
import json
import random
import string
import hashlib
import traceback

from d3applets.varlife_renderGif import createGif


# Create your views here.
def home_view(request, **kwargs):
    context = {}

    if sys.platform in ['win32', 'darwin']:
        path = os.path.join(os.getcwd(), "d3applets", "templates", "d3applets")
    elif sys.platform == 'linux':
        path = os.path.join("/home", "elendia", "webapps", "play", "play", "d3applets", "templates", "d3applets/")

    applets = []
    for filename in os.listdir(path):
        if filename.endswith('.html') and filename != "404.html":
            temp_file = open(os.path.join(path, filename), 'r')
            contents = temp_file.read()
            temp_file.close()

            header = re.search(r"<h1>(.*)</h1>", contents)
            description = re.search(r"<p id=['\"]desc['\"]>(.*)</p>", contents)

            if header and description:
                applets.append([header.group(1),
                                mark_safe(description.group(1)),
                                filename[:-5]])

    context['applets'] = sorted(applets)

    return render(request, 'd3applets/home.html', context)


def other_view(request, **kwargs):
    context = {}

    if 'code' in kwargs:
        kwargs['name'] = 'varlife'

        if sys.platform in ['win32', 'darwin']:
            filepath = os.path.join(os.getcwd(), "d3applets", "static", "d3applets", "shorturls", kwargs["code"] + '.txt')
        elif sys.platform == 'linux':
            filepath = os.path.join("/home", "elendia", "webapps", "static", "d3applets", "shorturls", kwargs["code"] + '.txt')

        try:
            context['info'] = open(filepath, 'r').read()
        except FileNotFoundError:  # noqa  # because apparently flake-8 linter doesn't know this is a builtin
            print("Aww bummer...")
            print("Filepath:", filepath)
            context['info'] = ''

    try:
        return render(request, 'd3applets/' + kwargs['name'] + '.html', context)
    except TemplateDoesNotExist:
        raise Http404


@csrf_exempt
def varlife_shortenURL(request, **kwargs):
    # context = {}
    filename = ''.join(random.choice(string.ascii_letters) for _ in range(10)) + '.txt'

    if sys.platform in ['win32', 'darwin']:
        filepath = os.path.join(os.getcwd(), "d3applets", "static", "d3applets", "shorturls", filename)
    elif sys.platform == 'linux':
        filepath = os.path.join("/home", "elendia", "webapps", "static", "d3applets", "shorturls", filename)

    try:
        data = request.POST['data']
        if type(data) == list:
            data = data[0]

        with open(filepath, 'w') as f:
            f.write(data)
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise e

    return HttpResponse(filename[:-4], content_type="text/plain")


@csrf_exempt
def varlife_renderGif(request, **kwargs):

    # context = {}

    grid_data = ast.literal_eval(request.POST['gridData'])
    color_data = ast.literal_eval(request.POST['colorData'])
    width = int(request.POST['width'])
    height = int(request.POST['height'])
    cell_size = int(request.POST['cellSize'])
    frame_duration = int(request.POST['frameDuration'])
    filename = ''.join(random.choice(string.ascii_letters) for _ in range(10)) + '.gif'

    if sys.platform in ['win32', 'darwin']:
        filepath = os.path.join(os.getcwd(), "d3applets", "static", "d3applets", "renders", filename)
    elif sys.platform == 'linux':
        filepath = os.path.join("/home", "elendia", "webapps", "static", "d3applets", "renders", filename)

    try:
        createGif(grid_data, color_data, width, height, cell_size, frame_duration, filepath)
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise e

    return HttpResponse(filename, content_type="text/plain")


@csrf_exempt
def qftasm_permalink(request, **kwargs):
    # context = {}

    if sys.platform in ['win32', 'darwin']:
        client = MongoClient('localhost', settings.MONGO_PORT)
    elif sys.platform == 'linux':
        client = MongoClient('localhost',
                             port=settings.MONGO_PORT,
                             username=settings.MONGO_USER,
                             password=settings.MONGO_PASSWORD,
                             authSource='qftasm',
                             authMechanism='SCRAM-SHA-1')

    programs = client.qftasm.programs
    configs = client.qftasm.configs
    keys = [
        'tps', 'mspt',
        'breakpoints-inst', 'breakpoints-read', 'breakpoints-write',
        'directWriteVal', 'directWriteAddr', 'breakOnBlank',
        'RAMdisplay',
    ]

    if request.method == 'POST':  # shortcode creation
        print("request.POST.keys(): ", request.POST.keys())
        code = request.POST['asm-code']
        program_sha1 = hashlib.sha1(bytes(code, encoding='utf-8')).hexdigest()

        program = programs.find_one({'sha1': program_sha1})
        if program is None:
            program = programs.insert_one({'asm-code': code, 'sha1': program_sha1})

        values = {key: request.POST[key] for key in keys}
        canonical = json.dumps(values)
        config_sha1 = hashlib.sha1(bytes(canonical, encoding='utf-8')).hexdigest()

        config = configs.find_one({'sha1': config_sha1})
        if config:
            shortcode = config['shortcode']
        else:
            shortcode = ''.join(random.choice(string.ascii_letters) for _ in range(10))
            values['sha1'] = config_sha1
            values['program_sha1'] = program_sha1
            values['shortcode'] = shortcode

            configs.insert_one(values)

        return HttpResponse(json.dumps({'shortcode': shortcode}), content_type="application/json")

    elif request.method == 'GET':  # shortcode fetch
        config = configs.find_one({'shortcode': request.GET['shortcode']})

        if config:
            config.pop('_id')
            config['asm-code'] = programs.find_one({'sha1': config['program_sha1']})['asm-code']

            return HttpResponse(json.dumps(config), content_type="application/json")

        else:
            return HttpResponse(json.dumps({'error': 'No configuration associated with that shortcode'}), content_type="application/json")
