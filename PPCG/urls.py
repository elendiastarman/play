from django.conf.urls import include, url

from PPCG.views import *

urlpatterns = [
    url(r'^convos$', convos_view, name='convos'),
]
