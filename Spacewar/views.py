from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe
from django.views.decorators.csrf import csrf_exempt

import os
import sys
import urllib
import traceback
import subprocess

# Create your views here.
def main_view(request, *args, **kwargs):

    context = RequestContext(request)

    if sys.platform == 'win32':
        path = os.path.join(os.getcwd(),"Spacewar","static","Spacewar")
    elif sys.platform == 'linux':
        path = os.path.join(os.getcwd(),"webapps","play","play","Spacewar","static","Spacewar")

    print(path)
    print(os.listdir(path))

    scripts = []
    for filename in os.listdir(path):
        if filename.endswith('.js'): scripts.append('Spacewar/'+filename)
    context['scripts'] = scripts

    return render(request, 'Spacewar/main.html', context_instance=context)

@csrf_exempt
def github_view(request, *args, **kwargs):

    data = json.loads(request.body.decode())

    if 'pusher' in data and sys.platform == 'linux':
        if data['pusher']['name'] in ('elendiastarman',):
            try:
                os.chdir("/home/elendia/webapps/maingit/repos/spacewar-js.git/")
                attempt = subprocess.call("./pull-from-github")
##                with open('github_pull_attempt.txt','w') as f: f.write("Exit code: %s"%attempt)
            except Exception as e:
                with open('spacewar-github-pull-error.txt','w') as f: f.write("Error: %s"%e) 

    return HttpResponse("OK")
