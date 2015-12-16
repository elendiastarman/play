from django.conf.urls import include, url

from Spacewar.views import *

urlpatterns = [
    url(r'^$', main_view, name='main'),
    url(r'^github$', github_view, name='github'),
    url(r'^intersectiontest$', intersectionTest_view, name='intersection_test'),
]
