from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned

from django.template import Context, RequestContext

# Create your views here.
def home_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/home.html', context_instance=context)

def dotandcross_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/dotandcross.html', context_instance=context)

def radiansDemo_view(request, **kwargs):
    context = RequestContext(request)

    return render(request, 'd3applets/radiansDemo.html', context_instance=context)
