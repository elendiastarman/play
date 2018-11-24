from django.conf.urls import include, url

from d3applets.views import *

urlpatterns = [
    url(r'^$', home_view, name='home'),
    url(r'^varlife/rendergif$', varlife_renderGif, name='varlife_renderGif'),
    url(r'^varlife/shortenurl$', varlife_shortenURL, name='varlife_shortenURL'),
    url(r'^varlife/(?P<code>\w*)$', other_view, name='other_code'),
    url(r'^qftasm/permalink$', qftasm_permalink, name='qftasm_permalink'),
    url(r'^(?P<name>\w*)/', other_view, name='other'),
    # url(r'^dotandcross/', dotandcross_view, name='dotandcross'),
    # url(r'^radians/', radiansDemo_view, name='radiansDemo'),
    # url(r'^gravity/', gravity_view, name='gravity'),
]
