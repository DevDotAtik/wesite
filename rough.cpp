#include<iostream>
using namespace std;
class Student{
    private:
        int age = 20;
};
int main(){
    Student s; 
    cout<<s.age;
    return 0;
}