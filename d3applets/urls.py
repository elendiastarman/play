from django.conf.urls import include, url

from general.views import tametsi_home_view
from d3applets.views import *

urlpatterns = [
    url(r'^$', home_view, name='home'),
    url(r'^varlife/rendergif$', varlife_renderGif, name='varlife_renderGif'),
    url(r'^varlife/shortenurl$', varlife_shortenURL, name='varlife_shortenURL'),
    url(r'^varlife/(?P<code>\w*)$', other_view, name='other_code'),
    url(r'^qftasm/permalink$', qftasm_permalink, name='qftasm_permalink'),
    url(r'^tametsi', tametsi_home_view, name="tametsi_home"),
    url(r'^(?P<name>\w*)/', other_view, name='other'),
]
