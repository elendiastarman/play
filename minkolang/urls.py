from django.conf.urls import include, url

from minkolang.views import *

urlpatterns = [
    url(r'^$', main_view, name='main'),
##    url(r'^dotandcross/', dotandcross_view, name='dotandcross'),
]
